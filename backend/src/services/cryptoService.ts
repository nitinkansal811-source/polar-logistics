import crypto from 'crypto';
import { CustodyLogEntry } from '../types/index.js';

export class CryptoService {
  public static calculateHash(
    index: number,
    prevHash: string,
    timestamp: string,
    actorId: string,
    location: string,
    action: string,
    condition: string
  ): string {
    const raw = `${index}|${prevHash}|${timestamp}|${actorId}|${location}|${action}|${condition}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  public static createGenesisBlock(actorId: string, actorName: string, location: string): CustodyLogEntry {
    const timestamp = new Date().toISOString();
    const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const hash = this.calculateHash(
      0,
      prevHash,
      timestamp,
      actorId,
      location,
      'MANIFEST_INITIALIZED',
      'sealed_normal'
    );

    return {
      index: 0,
      timestamp,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: 'NCPOR Logistics Officer',
      action: 'MANIFEST_INITIALIZED',
      location,
      condition: 'sealed_normal',
      prev_hash: prevHash,
      current_hash: hash,
      tamper_detected: false
    };
  }

  public static appendHandoff(
    history: CustodyLogEntry[],
    actorId: string,
    actorName: string,
    actorRole: string,
    action: string,
    location: string,
    condition: 'sealed_normal' | 'inspected_good' | 'minor_frost_wear' | 'tampered_flag',
    coords?: [number, number]
  ): CustodyLogEntry {
    const lastEntry = history[history.length - 1];
    const prevHash = lastEntry ? lastEntry.current_hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const nextIndex = history.length;
    const timestamp = new Date().toISOString();
    const currentHash = this.calculateHash(
      nextIndex,
      prevHash,
      timestamp,
      actorId,
      location,
      action,
      condition
    );

    return {
      index: nextIndex,
      timestamp,
      actor_id: actorId,
      actor_name: actorName,
      actor_role: actorRole,
      action,
      location,
      coordinates: coords,
      condition,
      prev_hash: prevHash,
      current_hash: currentHash,
      tamper_detected: false
    };
  }

  public static verifyChainIntegrity(chain: CustodyLogEntry[]): {
    isValid: boolean;
    compromisedIndex?: number;
    errorReason?: string;
  } {
    if (!chain || chain.length === 0) return { isValid: true };

    for (let i = 0; i < chain.length; i++) {
      const current = chain[i];

      if (i > 0) {
        const prev = chain[i - 1];
        if (current.prev_hash !== prev.current_hash) {
          return {
            isValid: false,
            compromisedIndex: i,
            errorReason: `Broken linkage: Block #${i} prev_hash (${current.prev_hash.slice(0, 10)}...) does not match Block #${i - 1} hash (${prev.current_hash.slice(0, 10)}...)`
          };
        }
      }

      const recalculated = this.calculateHash(
        current.index,
        current.prev_hash,
        current.timestamp,
        current.actor_id,
        current.location,
        current.action,
        current.condition
      );

      if (recalculated !== current.current_hash) {
        return {
          isValid: false,
          compromisedIndex: i,
          errorReason: `Hash mismatch at Block #${i}: Record contents mutated! Expected ${recalculated.slice(0, 10)}..., found ${current.current_hash.slice(0, 10)}...`
        };
      }
    }

    return { isValid: true };
  }
}
