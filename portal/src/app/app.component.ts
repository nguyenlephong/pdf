import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { StateService } from './core/services/state.service';
import { PdfViewerComponent } from './features/pdf-viewer/components/pdf-viewer.component';
import { FormConfigPanelComponent } from './features/pdf-viewer/components/form-config-panel.component';
import { PdfFillerComponent } from './features/pdf-filler/components/pdf-filler.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    PdfViewerComponent,
    FormConfigPanelComponent,
    PdfFillerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'PDF Form Builder';
  private destroy$ = new Subject<void>();

  constructor(
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    // Initialize any global state if needed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}