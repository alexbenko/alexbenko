import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Money Order',
  'Credit Card',
  'Debit Card',
  'Venmo',
  'PayPal',
  'Zelle',
  'Bank Transfer',
];

const DONATION_FUNDS = [
  'General Operating',
  'Food Purchases',
  'Outreach & Programs',
  'Volunteer Support',
  'Equipment & Supplies',
  'Emergency Relief',
  'Capital Improvements',
  'Holiday Drive',
];

const DONATION_TYPES = [
  'One-time',
  'Monthly Recurring',
  'Quarterly Recurring',
  'Annual Pledge',
  'In Honor Of',
  'In Memory Of',
  'Matching Gift',
  'Corporate Match',
];

@Component({
  selector: 'app-cash-donations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './cash-donations.component.html',
  styleUrl: './cash-donations.component.scss',
})
export class CashDonationsComponent implements OnInit {
  paymentMethodCtrl = new FormControl('');
  donationFundCtrl = new FormControl('');
  donationTypeCtrl = new FormControl('');
  donorNameCtrl = new FormControl('');
  amountCtrl = new FormControl('');
  dateCtrl = new FormControl(new Date());
  notesCtrl = new FormControl('');

  filteredPaymentMethods$!: Observable<string[]>;
  filteredFunds$!: Observable<string[]>;
  filteredTypes$!: Observable<string[]>;

  submitted = false;

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // startWith('') ensures the full list renders immediately on focus —
    // without it the dropdown appears empty until the user starts typing.
    this.filteredPaymentMethods$ = this.paymentMethodCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value ?? '', PAYMENT_METHODS))
    );

    this.filteredFunds$ = this.donationFundCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value ?? '', DONATION_FUNDS))
    );

    this.filteredTypes$ = this.donationTypeCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value ?? '', DONATION_TYPES))
    );
  }

  // Returns all options when the query is empty so the full list is visible
  // on focus, then narrows down as the user types.
  private _filter(value: string, options: string[]): string[] {
    if (!value.trim()) {
      return options;
    }
    const lower = value.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lower));
  }

  onSubmit(): void {
    this.submitted = true;
    this.snackBar.open('Donation recorded successfully.', 'Dismiss', {
      duration: 4000,
    });
    this.resetForm();
  }

  resetForm(): void {
    this.paymentMethodCtrl.reset('');
    this.donationFundCtrl.reset('');
    this.donationTypeCtrl.reset('');
    this.donorNameCtrl.reset('');
    this.amountCtrl.reset('');
    this.dateCtrl.reset(new Date());
    this.notesCtrl.reset('');
    this.submitted = false;
  }
}
