import { describe, expect, it } from 'vitest';
import { calculateShift } from '../packages/shared/src/index';

describe('calculateShift', () => {
  it('calcula minutos trabalhados descontando intervalo', () => {
    const summary = calculateShift([
      { eventType: 'clock_in', occurredAt: '2026-02-10T09:00:00Z' },
      { eventType: 'break_start', occurredAt: '2026-02-10T12:00:00Z' },
      { eventType: 'break_end', occurredAt: '2026-02-10T12:30:00Z' },
      { eventType: 'clock_out', occurredAt: '2026-02-10T18:00:00Z' }
    ]);

    expect(summary.breakMinutes).toBe(30);
    expect(summary.workedMinutes).toBe(510);
    expect(summary.status).toBe('complete');
  });

  it('marca incompleto quando sem saída', () => {
    const summary = calculateShift([
      { eventType: 'clock_in', occurredAt: '2026-02-10T09:00:00Z' }
    ]);

    expect(summary.status).toBe('incomplete');
    expect(summary.workedMinutes).toBe(0);
  });

  it('marca incompleto quando intervalo não foi encerrado', () => {
    const summary = calculateShift([
      { eventType: 'clock_in', occurredAt: '2026-02-10T09:00:00Z' },
      { eventType: 'break_start', occurredAt: '2026-02-10T12:00:00Z' },
      { eventType: 'clock_out', occurredAt: '2026-02-10T18:00:00Z' }
    ]);

    expect(summary.status).toBe('incomplete');
  });
});
