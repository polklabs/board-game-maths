import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Dice, DiceSet } from '../../models/dice.model';
import { CommonModule } from '@angular/common';
import { DiceSimpleComponent } from '../dice-simple/dice-simple.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../section-title/section-title.component';
import { Unique, nCk } from '../../helper';
import { TableModule } from 'primeng/table';
import { GameService } from '../../services/game.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectButtonModule,
    DiceSimpleComponent,
    SectionTitleComponent,
    TableModule,
  ],
  templateUrl: './dice.component.html',
  styleUrl: './dice.component.scss',
})
export class DiceComponent implements OnInit, OnDestroy {
  @Input() diceSet!: DiceSet;

  subscriptions = new Subscription();
  filteredDice: Dice[] = [];

  rollCount = '';

  tableViewOptions: any[] = [
    { label: 'Percent %', value: 'percent' },
    { label: 'Count #', value: 'count' },
    { label: 'Expanded', value: 'expanded' },
  ];
  tableView: 'percent' | 'count' | 'expanded' = 'percent';

  useSimpleDice = false;

  // Fancy dice
  diceRolls: {
    count: number;
    face: string;
    pExact: number;
    pAtLeast: number;
  }[] = [];

  constructor(private gameService: GameService) {
    this.subscriptions.add(
      gameService.expansions$.subscribe(() => {
        this.ngOnInit();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.diceRolls = [];
    this.useSimpleDice = false;

    this.filteredDice = this.gameService.expansionFilter(this.diceSet.dice);
    const allSimple = this.filteredDice.every((x) => x.type !== 'fancy');

    if (allSimple) {
      this.useSimpleDice = true;

      // Convert the list of d4-20 into fancy dice objects
      const expandedDice: Dice[] = [];
      this.filteredDice.forEach((d) => {
        expandedDice.push({
          type: 'fancy',
          sides: Array.from(
            { length: +d.type.substring(1) },
            (v, i) => `${i + 1}`
          ),
        });
      });

      this.calculateDiceRolls(expandedDice);
    } else {
      this.calculateDiceRolls(this.filteredDice);
    }

    const types = Unique(this.filteredDice.map((x) => x.type));
    this.rollCount = ` - ${this.filteredDice.length}${
      allSimple ? ' ' + types.join(' + ') : ''
    } roll${this.filteredDice.length > 1 ? 's' : ''}`;
  }

  // Assuming that a face has the same probability for all dice where it shows up
  calculateDiceRolls(dice: Dice[]) {
    const tempData: {
      face: string;
      probability: number;
      totalDice: number;
    }[] = [];

    const faces: string[] = Unique(dice.map((x) => x.sides).flat(2)).filter(
      (x) => x !== undefined
    ) as string[];
    faces.forEach((face) => {
      const validDice = dice.filter((x) => x.sides?.flat().includes(face));
      const die = validDice[0];
      const totalDice = validDice.length;

      if (!die) {
        throw new Error('Dice does not have valid face!');
      }

      tempData.push({
        face,
        probability:
          (die.sides?.flat().filter((x) => x === face).length ?? 1) /
          (die.sides?.length ?? 1),
        totalDice,
      });
    });

    tempData.forEach((t) => {
      for (let i = t.totalDice; i > 0; i--) {
        const pExact = this.pXSameValues(i, t.totalDice, t.probability) * 100;
        this.diceRolls.push({
          count: i,
          face: t.face,
          pExact,
          pAtLeast:
            pExact +
            this.diceRolls
              .filter((x) => x.face === t.face)
              .reduce((prev, curr) => prev + curr.pExact, 0),
        });
      }
    });

    this.diceRolls.sort((a, b) => a.count - b.count);
  }

  /**
   *
   * @param k number of same values wanted
   * @param n number of dice
   * @param p probability of rolling value
   * @returns The probability of rolling exactly X same values out of the set
   */
  pXSameValues(k: number, n: number, p: number): number {
    //P(X=k) = nCk · p^k · (1-p)^n-k

    //nCk
    const nChooseK = nCk(n, k);

    //p^k
    const pK = p ** k;

    //(1-p)^n-k
    const pNK = (1 - p) ** (n - k);

    return nChooseK * pK * pNK;
  }
}
