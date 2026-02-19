import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatAsistente } from './chat-asistente';

describe('ChatAsistente', () => {
  let component: ChatAsistente;
  let fixture: ComponentFixture<ChatAsistente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatAsistente]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatAsistente);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
