import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';
import { CryptoService } from '../services/cryptoService.js';
import { Asset } from '../types/index.js';

export const getAssets = async (req: Request, res: Response) => {
  const { category, station } = req.query;
  const store = DbStore.getInstance();
  const assets = await store.getAssets(category as string, station as string);
  return res.json({ assets, count: assets.length });
};

export const getAssetById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = DbStore.getInstance();
  const asset = await store.getAssetById(id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  // Also calculate chain integrity on the fly
  const integrity = CryptoService.verifyChainIntegrity(asset.custody_log);
  return res.json({ asset, integrity });
};

export const createAsset = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const { name, category, weight_kg, origin, destination, priority, actor_name, actor_id } = req.body;

  const id = `ast-${Date.now()}`;
  const code = `AST-${category.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const genesis = CryptoService.createGenesisBlock(
    actor_id || 'usr-log-01',
    actor_name || 'Logistics Controller',
    origin || 'Cape Town Hub'
  );

  const newAsset: Asset = {
    id,
    code,
    name,
    category: category || 'spares',
    weight_kg: Number(weight_kg) || 100,
    volume_m3: parseFloat(((Number(weight_kg) || 100) * 0.002).toFixed(2)),
    origin: origin || 'Cape Town Port',
    destination: destination || 'Maitri Station',
    current_location: origin || 'Cape Town Port',
    coordinates: [-33.9249, 18.4241],
    status: 'stored',
    priority: priority || 'routine',
    temperature_sensitive: false,
    custody_log: [genesis]
  };

  await store.addAsset(newAsset);
  return res.status(201).json({ asset: newAsset });
};

export const appendCustodyHandoff = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { actor_id, actor_name, actor_role, action, location, condition, coordinates } = req.body;
  const store = DbStore.getInstance();

  const updated = await store.appendCustodyLog(
    id,
    actor_id || 'usr-anon',
    actor_name || 'Polar Officer',
    actor_role || 'Field Personnel',
    action || 'TRANSFER_OF_CUSTODY',
    location || 'In Transit',
    condition || 'sealed_normal',
    coordinates
  );

  if (!updated) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  const integrity = CryptoService.verifyChainIntegrity(updated.custody_log);
  return res.json({ asset: updated, integrity });
};

export const simulateTamper = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { block_index } = req.body;
  const store = DbStore.getInstance();

  const asset = await store.simulateTamper(id, block_index !== undefined ? Number(block_index) : 0);
  if (!asset) {
    return res.status(404).json({ error: 'Asset or block index not found' });
  }

  const integrity = CryptoService.verifyChainIntegrity(asset.custody_log);
  return res.json({
    message: 'TAMPER_INJECTED: Block audit string modified without updating cryptographic hash',
    asset,
    integrity
  });
};

export const repairTamper = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = DbStore.getInstance();
  const asset = await store.repairTamper(id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const integrity = CryptoService.verifyChainIntegrity(asset.custody_log);
  return res.json({ message: 'Audit chain restored to pristine state', asset, integrity });
};

export const verifyAssetChain = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = DbStore.getInstance();
  const asset = await store.getAssetById(id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const integrity = CryptoService.verifyChainIntegrity(asset.custody_log);
  return res.json({ asset_id: id, integrity });
};
