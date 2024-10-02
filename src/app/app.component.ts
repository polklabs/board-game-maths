import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { gameList } from './metadata/metadata';
import { DefaultComponent } from './games/default/default.component';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';

declare let gtag: Function;

type GameItem = {
  label: string;
  routerLink: string;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    DefaultComponent,
    RouterModule,
    ToggleButtonModule,
    TooltipModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements AfterViewInit {
  games: GameItem[] = gameList;
  selectedGame: GameItem = this.games[0];
  gameChanged = 0;

  proMode = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-KMP5R7HPKG', {
          page_path: event.urlAfterRedirects,
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.selectedGame =
      this.games.find((x) => x.routerLink === window.location.pathname) ??
      this.games[0];
    this.games.sort((a, b) => a.label.localeCompare(b.label));
    this.gameChanged++;
  }

  gameClicked(game: GameItem) {
    this.router.navigateByUrl(game.routerLink);
    this.gameChanged++;
  }
}
