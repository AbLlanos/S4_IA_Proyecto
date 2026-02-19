import { Component } from '@angular/core';
import { Route, Router, RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-asistente',
  imports: [],
  templateUrl: './asistente.html',
  styleUrl: './asistente.css',
})
export class Asistente {
  constructor (private route : Router) {}

  iraBot(): void{
this.route.navigate(["/"])
  }
}
