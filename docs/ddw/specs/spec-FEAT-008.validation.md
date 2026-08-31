```
/ddw-validate-spec docs/ddw/specs/spec-FEAT-008.md — PASSED
────────────────────────────────────────────────────────────────
  ✅ F-SPEC-01: all 18 FR from the PRD are referenced by a block
  ✅ F-SPEC-02: all 19 AC from the PRD are named by at least one test
  ✅ F-SPEC-03: all 3 NFR carry a technical strategy
  ·  6 block(s) found
  ✅ F-SPEC-04: every block lists the files it creates or modifies
  ✅ F-SPEC-05: every block has a verifiable completion criterion
  ✅ F-SPEC-06: every block lists at least one required test
  ✅ F-SPEC-07: every endpoint carries a complete contract
  ✅ F-SPEC-08: every schema declares its constraints
  ✅ F-SPEC-09: every block taking input documents its validation
  ✅ F-SPEC-10: every block documents its error handling
  ✅ F-SPEC-16: every documented error is named by a test
  ✅ F-SPEC-11: dependencies between blocks are declared
  ⚠️ W-SPEC-02: large block, consider splitting: Block 1 (Login en el backend) (9 files, 471 words), Block 2 (Autenticación real en transacciones (cierra R1 de FEAT-005)) (7 files, 475 words), Block 3 (Núcleo de sesión (next-auth)) (10 files, 680 words), Block 4 (Pantalla de login) (6 files, 375 words), Block 5 (Controles de sesión en el header) (8 files, 289 words), Block 6 (Transacciones autenticadas sin exponer el token (ADR-008)) (6 files, 488 words)
  ⚠️ W-SPEC-03: schema changes with no rollback or reverse-migration consideration
  👁  F-SPEC-12 (contradicts the PRD) and F-SPEC-13 (terminology diverging from
      the PRD) are MANUAL: judge them and say so explicitly in your report.
  ✅ F-SPEC-LOOP: 0 loop(s) since a human decided, under the ceiling of 3; 1 in total for this document
────────────────────────────────────────────────────────────────
Total: 13 passed, 0 failed, 2 warnings
Result: PASSED
```
