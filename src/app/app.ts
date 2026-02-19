import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from "./components/navbar/navbar";
import { Home } from "./components/home/home";
import { InfoCards } from "./components/info-cards/info-cards";
import { Footer } from "./components/footer/footer";
import { Asistente } from "./components/asistente/asistente";

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [RouterOutlet, Home,],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('proyectoIA');
}
