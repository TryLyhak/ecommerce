import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Footer } from './footer/footer';
import { Navbar } from './navbar/navbar';
import { CatalogService } from './services/catalog.service';
@Component({
  selector: 'app-root',
  imports: [Footer, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'ng_web';
  // private catalog = inject(CatalogService);

  // constructor() {
  //   this.catalog.getProducts({ per_page: 3 }).subscribe((result) => {
  //     console.log('API Product:', result);
  //   });
  // }
}
