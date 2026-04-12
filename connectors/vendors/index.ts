import type { MarketDataConnectorDefinition } from '../core/contracts';

import { IBKR_TWS_CONNECTOR } from './ibkr/ibkrConnector';
import { POLYGON_REST_CONNECTOR } from './polygon/polygonConnector';

export const CONNECTOR_DEFINITIONS: MarketDataConnectorDefinition[] = [
  IBKR_TWS_CONNECTOR,
  POLYGON_REST_CONNECTOR,
];

export function getConnectorDefinition(vendorId: string): MarketDataConnectorDefinition | null {
  return CONNECTOR_DEFINITIONS.find((entry) => entry.descriptor.id === vendorId) ?? null;
}
