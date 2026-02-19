import { Routes } from '@angular/router';
import { ChatAsistente } from './components/chat-asistente/chat-asistente';
import { Home } from './components/home/home';

export const routes: Routes = [

    { path: '', component: Home, pathMatch: 'full' },
    { path: 'chatAsistente', component: ChatAsistente },

];
