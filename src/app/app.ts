import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './footer/footer';
import { Navbar } from './navbar/navbar';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [Footer, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'ng_web';
  private auth = inject(AuthService);

  ngOnInit(): void {
    // After a page reload we still have the token, but not the user's details.
    // Ask the API who is signed in. If the token is no longer valid, the
    // interceptor clears the session by itself.
    if (this.auth.isLoggedIn()) {
      this.auth.loadCurrentUser().subscribe({ error: () => {} });
    }
  }
}
