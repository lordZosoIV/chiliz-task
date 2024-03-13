import { Controller, Get, Param } from '@nestjs/common'; // Import Param decorator
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('count')
  async getTotalTransfers(): Promise<string> {
    return await this.appService.getTotalTransfers();
  }

  @Get('filter/:txHash')
  async getInteractionByTxHash(
    @Param('txHash') txHash: string,
  ): Promise<boolean> {
    return await this.appService.getInteractionByTxHash(txHash);
  }
}
