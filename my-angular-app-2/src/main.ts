// src/main.ts

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { init as initApm, ApmBase, Transaction } from '@elastic/apm-rum';
import { Router, NavigationStart, NavigationEnd, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';

if (environment.production) {
  enableProdMode();
}

// Initialize APM
const apm: ApmBase = initApm({
  serviceName: 'my-angular-app',  // Your application name
  serverUrl: environment.apmServerUrl,  // APM Server URL from environment fil
});

console.log(environment.apmServerUrl)
// Bootstrap the Angular module
platformBrowserDynamic().bootstrapModule(AppModule)
  .then((moduleRef) => {
    // Angular Router instance
    const router = moduleRef.injector.get(Router);

    // Variable to hold the current transaction, allowing null and undefined
    let currentTransaction: Transaction | null | undefined = apm.startTransaction('Navigation', 'route-change');

    // Start a new transaction on navigation start
    router.events.pipe(
      filter(event => event instanceof NavigationStart)
    ).subscribe(() => {
      if (currentTransaction) {
        currentTransaction.end(); // End the previous transaction if exists
      }
      currentTransaction = apm.startTransaction('Navigation', 'route-change'); // Start a new transaction
    });

    // End the current transaction on navigation end or error
    router.events.pipe(
      filter(event => event instanceof NavigationEnd || event instanceof NavigationError)
    ).subscribe(() => {
      if (currentTransaction) {
        currentTransaction.end();
        currentTransaction = undefined; // Reset the transaction variable
      }
    });
  })
  .catch(err => console.error(err));
