import { Component } from '@angular/core';

@Component({
  selector: 'app-preguntas-frecuentes',
  imports: [],
  templateUrl: './preguntas-frecuentes.html',
  styleUrl: './preguntas-frecuentes.css',
})
export class PreguntasFrecuentes {

    openStates: boolean[] = [false, false, false, false];

  toggle(index: number): void {
    this.openStates[index] = !this.openStates[index];
  }

}
