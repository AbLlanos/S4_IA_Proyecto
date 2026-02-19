import { Component } from '@angular/core';
import { Navbar } from "../navbar/navbar";
import { Footer } from "../footer/footer";
import { Asistente } from "../asistente/asistente";
import { Hero } from "../hero/hero";
import { InfoCards } from "../info-cards/info-cards";
import { PreguntasFrecuentes } from "../preguntas-frecuentes/preguntas-frecuentes";

@Component({
  selector: 'app-home',
  imports: [Navbar, Footer, Asistente, Hero, InfoCards, PreguntasFrecuentes],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
