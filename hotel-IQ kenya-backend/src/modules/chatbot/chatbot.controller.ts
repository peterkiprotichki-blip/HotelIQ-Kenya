import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatMessageDto, CompareRoomsDto } from './dto/chat-message.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Chatbot')
@Controller('public/chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  chat(@Body() dto: ChatMessageDto) {
    return this.chatbotService.chat(dto);
  }

  @Post('compare')
  compareRooms(@Body() dto: CompareRoomsDto) {
    return this.chatbotService.compareRooms(dto);
  }
}
