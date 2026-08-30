import { Types } from "mongoose";

import { InvariantError } from "../../application/errors/InvariantError";
import type { MoneySource } from "../../domain/entities/MoneySource";
import type { IMoneySourceRepository } from "../../domain/repositories/IMoneySourceRepository";
import {
    MoneySourceModel,
    type MoneySourceDocument
} from "../models/MoneySourceModel";

const MONEY_SOURCE_NOT_FOUND_MESSAGE =
    "MoneySource no encontrada al recalcular el balance";

const toEntity = (document: MoneySourceDocument): MoneySource => ({
    id: document._id.toString(),
    userId: document.userId.toString(),
    name: document.name,
    virtual: document.virtual,
    amountARS: document.amountARS,
    amountUSD: document.amountUSD
});

export class MoneySourceRepository implements IMoneySourceRepository {
    async findById(id: string): Promise<MoneySource | null> {
        if (!Types.ObjectId.isValid(id)) {
            return null;
        }

        const document = await MoneySourceModel.findById(id);
        return document ? toEntity(document) : null;
    }

    // `findOneAndUpdate` + `$inc` es atómico a nivel de Mongo (mitigación R3 del threat model):
    // evita condiciones de carrera al recalcular el balance ante escrituras concurrentes.
    async incrementAmount(
        id: string,
        currency: "ARS" | "USD",
        delta: number
    ): Promise<void> {
        if (!Types.ObjectId.isValid(id)) {
            throw new InvariantError(MONEY_SOURCE_NOT_FOUND_MESSAGE);
        }

        const field = currency === "ARS" ? "amountARS" : "amountUSD";

        const updated = await MoneySourceModel.findOneAndUpdate(
            { _id: id },
            { $inc: { [field]: delta } }
        );

        if (!updated) {
            throw new InvariantError(MONEY_SOURCE_NOT_FOUND_MESSAGE);
        }
    }
}
