import { Router } from 'express';
import * as authCtrl from '../controllers/authController.js';
import * as assetCtrl from '../controllers/assetController.js';
import * as invCtrl from '../controllers/inventoryController.js';
import * as perCtrl from '../controllers/personnelController.js';
import * as routeCtrl from '../controllers/routeController.js';
import * as emgCtrl from '../controllers/emergencyController.js';
import * as syncCtrl from '../controllers/syncController.js';
import * as simCtrl from '../controllers/simulationController.js';
import * as aiCtrl from '../controllers/aiController.js';

const router = Router();

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authCtrl.getMe);
router.get('/auth/users', authCtrl.getDemoUsers);

// Stations
router.get('/stations', simCtrl.getStations);

// Assets & Cryptographic Custody
router.get('/assets', assetCtrl.getAssets);
router.post('/assets', assetCtrl.createAsset);
router.get('/assets/:id', assetCtrl.getAssetById);
router.post('/assets/:id/custody', assetCtrl.appendCustodyHandoff);
router.post('/assets/:id/tamper', assetCtrl.simulateTamper);
router.post('/assets/:id/repair', assetCtrl.repairTamper);
router.get('/assets/:id/verify', assetCtrl.verifyAssetChain);

// Inventory & Forecasting
router.get('/inventory', invCtrl.getInventory);
router.get('/inventory/:stationId', invCtrl.getStationInventory);
router.get('/inventory/:stationId/forecast', invCtrl.getResupplyForecast);
router.post('/inventory/:id/ration', invCtrl.enactRationing);

// Personnel & Winter-Over
router.get('/personnel', perCtrl.getPersonnel);
router.patch('/personnel/:id/location', perCtrl.updatePersonnelLocation);
router.get('/personnel/donors/:bloodGroup', perCtrl.getCompatibleDonors);
router.get('/personnel/summary', perCtrl.getWinterOverSummary);

// Routes & Optimization
router.get('/routes', routeCtrl.getRouteLegs);
router.get('/routes/recommend', routeCtrl.recommendRoute);

// Emergency Response
router.get('/emergency', emgCtrl.getIncidents);
router.post('/emergency/trigger', emgCtrl.triggerEmergency);
router.get('/emergency/:id', emgCtrl.getIncidentById);

// Offline Batch Sync
router.post('/sync/batch', syncCtrl.processBatchSync);

// Simulation & Demo Controls
router.get('/simulation/state', simCtrl.getSimulationState);
router.post('/simulation/time-warp', simCtrl.setTimeWarp);
router.post('/simulation/blizzard', simCtrl.triggerBlizzard);
router.post('/simulation/satellite-blackout', simCtrl.triggerSatelliteBlackout);
router.post('/simulation/toggle-satellite', simCtrl.toggleSatellite);

// AI Tactical Agent (Groq Powered)
router.post('/ai/chat', aiCtrl.chat);
router.get('/ai/status', aiCtrl.getStatus);
router.post('/ai/config', aiCtrl.setConfig);

export default router;
