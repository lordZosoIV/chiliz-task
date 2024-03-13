import { Provider } from '@nestjs/common';
import Web3 from 'web3';
import * as dotenv from 'dotenv';

export const Web3Provider: Provider = {
  provide: Web3,
  useFactory: () => {
    dotenv.config();
    const providerUrl = process.env.PROVIDER_URL;
    const provider = new Web3.providers.WebsocketProvider(providerUrl);
    if (!providerUrl) {
      throw new Error('Provider URL is not configured.');
    }
    return provider;
  },
};
