import { Component } from '@angular/core';
import { SectionTitleComponent } from '../../shared/components/section-title/section-title.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { sevenWondersMetadata } from '../../metadata/seven-wonders.metadata';
import { GameService } from '../../shared/services/game.service';
import { CardCameraComponent } from '../../card-camera/card-camera.component';

const tabletSvg = '/assets/images/games/7-wonders/tablet.svg';
const compassSvg = '/assets/images/games/7-wonders/compass.svg';
const gearSvg = '/assets/images/games/7-wonders/gear.svg';

type Science = { name: string; code: string; count: number };

@Component({
  selector: 'app-seven-wonders',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    SectionTitleComponent,
    CardCameraComponent,
    TableModule,
    CardModule,
  ],
  templateUrl: './seven-wonders.component.html',
  styleUrl: './seven-wonders.component.scss',
})
export class SevenWondersComponent {
  game = sevenWondersMetadata;

  // Science Cards
  science: Science[] = [
    { name: `<img src="${tabletSvg}">`, code: 'T', count: 0 },
    { name: `<img src="${compassSvg}">`, code: 'C', count: 0 },
    { name: `<img src="${gearSvg}">`, code: 'G', count: 0 },
    {
      name: `<img src="${tabletSvg}"> / <img src="${compassSvg}"> / <img src="${gearSvg}">`,
      code: 'TCG',
      count: 0,
    },
    {
      name: `<img src="${tabletSvg}"> / <img src="${compassSvg}">`,
      code: 'TC',
      count: 0,
    },
    {
      name: `<img src="${tabletSvg}"> / <img src="${gearSvg}">`,
      code: 'TG',
      count: 0,
    },
    {
      name: `<img src="${compassSvg}"> / <img src="${gearSvg}">`,
      code: 'CG',
      count: 0,
    },
  ];
  scienceCombinations = new Set<string>();
  maxScienceScore = 0;
  maxScienceCombo = '';

  constructor(private gameService: GameService) {}

  adjustScience(science: Science, adjust: number) {
    science.count += adjust;
    science.count = Math.max(0, science.count);
    this.calculateScience();
  }

  setScience(science: Science, value: number) {
    science.count = value;
    science.count = Math.max(0, science.count);
    this.calculateScience();
  }

  calculateScience(): void {
    const base =
      'T'.repeat(this.science[0].count) +
      'C'.repeat(this.science[1].count) +
      'G'.repeat(this.science[2].count);
    const options: string[][] = [];
    this.scienceCombinations = new Set<string>();

    for (let i = 3; i <= 6; i++) {
      for (let s = 0; s < this.science[i].count; s++) {
        options.push(this.science[i].code.split(''));
      }
    }

    if (options.length > 0) {
      this.generateCombinations(options.length, options, '');
    }

    this.maxScienceScore = this.scienceValue(base);
    this.maxScienceCombo = base;
    [...this.scienceCombinations].forEach((combo) => {
      const score = this.scienceValue(base + combo);
      if (score > this.maxScienceScore) {
        this.maxScienceScore = score;
        this.maxScienceCombo = base + combo;
      }
    });
  }

  generateCombinations(
    rolls: number,
    options: string[][],
    combination: string
  ) {
    const option = options[rolls - 1];

    if (rolls === 0) {
      const array = combination.split('');
      array.sort((a, b) => a.localeCompare(b));
      combination = array.join('');
      this.scienceCombinations.add(combination);
      return;
    }

    // Loop through all possible dice values (1 to 6)
    for (let i = 0; i < option.length; i++) {
      this.generateCombinations(rolls - 1, options, combination + option[i]);
    }
  }

  scienceValue(science: string): number {
    const items = science.split('');
    const T = items.filter((x) => x === 'T').length;
    const C = items.filter((x) => x === 'C').length;
    const G = items.filter((x) => x === 'G').length;
    let total = 0;
    total += T ** 2;
    total += C ** 2;
    total += G ** 2;
    total += Math.min(T, C, G) * 7;

    return total;
  }

  scienceString(science: string): string {
    const items = science.split('');
    const T = items.filter((x) => x === 'T').length;
    const C = items.filter((x) => x === 'C').length;
    const G = items.filter((x) => x === 'G').length;

    return `<img src="${tabletSvg}"> x${T} / <img src="${compassSvg}"> x${C} / <img src="${gearSvg}"> x${G}`;
  }
}
