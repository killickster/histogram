import { bootstrapApplication } from '@angular/platform-browser'

import { ChartComponent } from './app/chart.component'

bootstrapApplication(ChartComponent)
  .catch(err => console.error(err))