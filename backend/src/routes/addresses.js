import {Router} from 'express';
import {addressMetadata,listAddressUnits} from '../services/address.service.js';
export const addressRouter=Router();
addressRouter.get('/addresses/meta',(_req,res)=>res.json({data:addressMetadata()}));
addressRouter.get('/addresses', (req,res)=>res.json({data:listAddressUnits(req.query)}));