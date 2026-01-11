import { Component, input, model } from '@angular/core';
import { FormValueControl, ValidationError, WithOptionalField } from '@angular/forms/signals';

@Component({
  selector: 'age-stepper',
  templateUrl: './age-stepper.component.html',
  styleUrls: ['./age-stepper.component.scss'],
})
export class AgeStepperComponent implements FormValueControl<number> {
  // REQUIRED for FormValueControl: value model signal
  value = model.required<number>();

  // Optional UI state signals provided by the form (implement what you need)
  disabled = input(false);
  readonly = input(false);

  touched = model(false);
  invalid = model(false);
  errors = input<readonly WithOptionalField<ValidationError>[]>([]);

  // Optional constraints (nice to demonstrate built-in validators)
  min = input<number | undefined>();
  max = input<number | undefined>();

  increment() {
    this.touched.set(true);
    const next = this.value() + 1;
    this.value.set(next);
  }

  decrement() {
    this.touched.set(true);
    const next = this.value() - 1;
    const min = 0;
    if (min !== undefined && next < min) return;
    this.value.set(next);
  }
}
