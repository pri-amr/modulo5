import { ForbiddenError } from '../../../application/errors/ForbiddenError';
import { ValidationError } from '../../../application/errors/ValidationError';
import { CreateTransactionService } from '../../../application/services/CreateTransactionService';
import type { Category } from '../../../domain/entities/Category';
import type { MoneySource } from '../../../domain/entities/MoneySource';
import type { Transaction } from '../../../domain/entities/Transaction';
import type { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import type { IMoneySourceRepository } from '../../../domain/repositories/IMoneySourceRepository';
import type {
  CreateTransactionInput,
  ITransactionRepository,
} from '../../../domain/repositories/ITransactionRepository';

class FakeTransactionRepository implements ITransactionRepository {
  readonly store = new Map<string, Transaction>();
  private counter = 0;

  create(input: CreateTransactionInput): Promise<Transaction> {
    this.counter += 1;
    const id = `tx-${this.counter}`;
    const now = new Date();
    const transaction: Transaction = { id, ...input, createdAt: now, updatedAt: now };
    this.store.set(id, transaction);
    return Promise.resolve(transaction);
  }

  findById(id: string): Promise<Transaction | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  deleteById(id: string): Promise<void> {
    this.store.delete(id);
    return Promise.resolve();
  }
}

class FakeMoneySourceRepository implements IMoneySourceRepository {
  constructor(
    private readonly sources: Map<string, MoneySource>,
    private readonly incrementAmountImpl?: (
      id: string,
      currency: 'ARS' | 'USD',
      delta: number,
    ) => Promise<void>,
  ) {}

  findById(id: string): Promise<MoneySource | null> {
    return Promise.resolve(this.sources.get(id) ?? null);
  }

  incrementAmount(id: string, currency: 'ARS' | 'USD', delta: number): Promise<void> {
    if (this.incrementAmountImpl) {
      return this.incrementAmountImpl(id, currency, delta);
    }

    const source = this.sources.get(id);
    if (!source) {
      return Promise.reject(new Error('MoneySource no encontrada'));
    }

    if (currency === 'ARS') {
      source.amountARS += delta;
    } else {
      source.amountUSD += delta;
    }

    return Promise.resolve();
  }
}

class FakeCategoryRepository implements ICategoryRepository {
  constructor(private readonly categories: Map<string, Category>) {}

  findById(id: string): Promise<Category | null> {
    return Promise.resolve(this.categories.get(id) ?? null);
  }
}

const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const buildMoneySource = (overrides: Partial<MoneySource> = {}): MoneySource => ({
  id: 'money-source-1',
  userId: USER_ID,
  name: 'Cuenta corriente',
  virtual: false,
  amountARS: 1000,
  amountUSD: 100,
  ...overrides,
});

const buildCategory = (overrides: Partial<Category> = {}): Category => ({
  id: 'category-1',
  userId: USER_ID,
  name: 'Comida',
  ...overrides,
});

const validDto = {
  type: 'egreso' as const,
  amount: 250,
  moneySourceId: 'money-source-1',
  currency: 'ARS' as const,
  categoryId: 'category-1',
  date: '15-03-2026',
  description: 'Supermercado',
};

const buildService = (
  moneySource: MoneySource,
  category: Category,
  incrementAmountImpl?: (id: string, currency: 'ARS' | 'USD', delta: number) => Promise<void>,
): {
  service: CreateTransactionService;
  transactionRepository: FakeTransactionRepository;
  moneySources: Map<string, MoneySource>;
} => {
  const moneySources = new Map<string, MoneySource>([[moneySource.id, moneySource]]);
  const categories = new Map<string, Category>([[category.id, category]]);
  const transactionRepository = new FakeTransactionRepository();
  const moneySourceRepository = new FakeMoneySourceRepository(moneySources, incrementAmountImpl);
  const categoryRepository = new FakeCategoryRepository(categories);

  const service = new CreateTransactionService(
    transactionRepository,
    moneySourceRepository,
    categoryRepository,
  );

  return { service, transactionRepository, moneySources };
};

describe('CreateTransactionService', () => {
  it('crea un egreso válido: disminuye el balance de la moneda afectada y no toca la otra', async () => {
    const moneySource = buildMoneySource({ amountARS: 1000, amountUSD: 100 });
    const category = buildCategory();
    const { service, moneySources } = buildService(moneySource, category);

    await service.execute(USER_ID, { ...validDto, type: 'egreso', amount: 250, currency: 'ARS' });

    const updated = moneySources.get('money-source-1')!;
    expect(updated.amountARS).toBe(750);
    expect(updated.amountUSD).toBe(100);
  });

  it('crea un ingreso válido: aumenta el balance de la moneda afectada y no toca la otra', async () => {
    const moneySource = buildMoneySource({ amountARS: 1000, amountUSD: 100 });
    const category = buildCategory();
    const { service, moneySources } = buildService(moneySource, category);

    await service.execute(USER_ID, { ...validDto, type: 'ingreso', amount: 300, currency: 'USD' });

    const updated = moneySources.get('money-source-1')!;
    expect(updated.amountARS).toBe(1000);
    expect(updated.amountUSD).toBe(400);
  });

  it('rechaza sin amount', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());
    const { amount: _amount, ...dtoWithoutAmount } = validDto;

    await expect(service.execute(USER_ID, dtoWithoutAmount)).rejects.toThrow(ValidationError);
  });

  it('rechaza amount <= 0', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());

    await expect(service.execute(USER_ID, { ...validDto, amount: 0 })).rejects.toThrow(
      ValidationError,
    );
    await expect(service.execute(USER_ID, { ...validDto, amount: -10 })).rejects.toThrow(
      ValidationError,
    );
  });

  it.each(['moneySourceId', 'currency', 'categoryId', 'date', 'description'])(
    'rechaza sin %s',
    async (field) => {
      const { service } = buildService(buildMoneySource(), buildCategory());
      const incompleteDto = { ...validDto };
      delete (incompleteDto as Record<string, unknown>)[field];

      await expect(service.execute(USER_ID, incompleteDto)).rejects.toThrow(ValidationError);
    },
  );

  it('rechaza date en formato distinto a DD-MM-YYYY', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());

    await expect(
      service.execute(USER_ID, { ...validDto, date: '2026-03-15' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza date con formato correcto pero que no es una fecha real', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());

    await expect(
      service.execute(USER_ID, { ...validDto, date: '31-02-2026' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza date con mes fuera de 01-12', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());

    await expect(
      service.execute(USER_ID, { ...validDto, date: '13-13-2026' }),
    ).rejects.toThrow(ValidationError);
  });

  it('rechaza moneySourceId de otro usuario con ForbiddenError 403', async () => {
    const moneySource = buildMoneySource({ userId: OTHER_USER_ID });
    const { service } = buildService(moneySource, buildCategory());

    const error: unknown = await service.execute(USER_ID, validDto).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).statusCode).toBe(403);
  });

  it('rechaza categoryId de otro usuario con ForbiddenError 403', async () => {
    const category = buildCategory({ userId: OTHER_USER_ID });
    const { service } = buildService(buildMoneySource(), category);

    const error: unknown = await service.execute(USER_ID, validDto).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ForbiddenError);
    expect((error as ForbiddenError).statusCode).toBe(403);
  });

  it('rechaza un campo extra no declarado en el DTO', async () => {
    const { service } = buildService(buildMoneySource(), buildCategory());

    await expect(
      service.execute(USER_ID, { ...validDto, extraField: 'no declarado' }),
    ).rejects.toThrow(ValidationError);
  });

  it('si incrementAmount falla después de crear la transacción, revierte la transacción y propaga el error', async () => {
    const moneySource = buildMoneySource();
    const category = buildCategory();
    const failingIncrement = (): Promise<void> => Promise.reject(new Error('Fallo de balance'));
    const { service, transactionRepository } = buildService(moneySource, category, failingIncrement);

    await expect(service.execute(USER_ID, validDto)).rejects.toThrow('Fallo de balance');
    expect(transactionRepository.store.size).toBe(0);
  });
});
