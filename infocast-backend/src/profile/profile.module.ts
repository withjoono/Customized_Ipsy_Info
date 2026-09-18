import { Module } from '@nestjs/common';
import { HubModule } from '../hub/hub.module';
import { ProfileController } from './profile.controller';

@Module({
  imports: [HubModule],
  controllers: [ProfileController],
})
export class ProfileModule {}
