import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
// import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, Field, required, email, validateAsync, debounce, hidden, validate, applyEach, submit, min, disabled } from '@angular/forms/signals';
import { JsonPipe } from '@angular/common';
import { resource } from '@angular/core';
import { AuthApiMockService, SignUpForm } from './auth-api.service';
import { AgeStepperComponent } from '../age-stepper/age-stepper.component';

// interface SignUpForm {
// 	username: FormControl<string>;
// 	email: FormControl<string>;
// }

interface Address {
	streetLine1: string;
	streetLine2?: string;
	city: string;
	state: string;
	zip: string;
}

// interface SignUpForm {
//   username: string;
//   email: string;
// 	age: string;
// 	guardianName: string;
// 	// address: Address;
// 	alternateEmails: string[];
// }

// function usernameValidator(
// 	control: FormControl<string>
// ): { [key: string]: any } | null {
// function usernameValidator(field: FieldPath<string>) {
// 	validate(field, ctx => {
// 		// const value = control.value;
// 		const value = ctx.value() as string;

// 		if (!value) {
// 			return null; // Let required validator handle empty values
// 		}

// 		// Must be alphanumeric only
// 		if (!/^[a-zA-Z0-9]+$/.test(value)) {
// 			// return {
// 			// 	usernameInvalid: {
// 			// 		message: "Username must contain only letters and numbers",
// 			// 	},
// 			// };

// 			return customError({
// 				kind: 'usernameInvalid',
// 				message: 'Username must contain only letters and numbers',
// 			});
// 		}

// 		// Must be 3-20 characters
// 		if (value.length < 3 || value.length > 20) {
// 			// return {
// 			// 	usernameInvalid: {
// 			// 		message: "Username must be between 3 and 20 characters",
// 			// 	},
// 			// };

// 			return customError({
// 				kind: 'usernameInvalid',
// 				message: 'Username must be between 3 and 20 characters',
// 			});
// 		}

// 		return null;
// 	});
// }

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrl: './form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
	// imports: [ReactiveFormsModule],
  imports: [Field, JsonPipe, AgeStepperComponent],
})
export class FormComponent {
	// protected form = new FormGroup<SignUpForm>({
	// 	username: new FormControl<string>('', {
	// 		nonNullable: true,
	// 		validators: [Validators.required, usernameValidator],
	// 	}),
	// 	email: new FormControl<string>('', {
	// 		nonNullable: true,
	// 		validators: [Validators.required, Validators.email],
	// 	}),
	// });

	private readonly api = inject(AuthApiMockService);

  protected model = signal<SignUpForm>({
		username: '',
		email: '',
		// age: '',
		age: 10,
		guardianName: '',
		// address: {
		// 	streetLine1: '',
		// 	streetLine2: '',
		// 	city: '',
		// 	state: '',
		// 	zip: ''			
		// }
		alternateEmails: [''],
	});

	protected form = form(this.model, s => {
		required(s.username);
		// required(s.email);
		// email(s.email);
		// usernameValidator(s.username);

		// hidden(s.guardianName, ({ valueOf }) => {
		// 	const v = valueOf(s.age);
		// 	// return v === '' || Number(v) >= 18;
		// 	return v >= 18;
		// });

		min(s.age, 10, { message: 'You must be at least 10 years old' });
		disabled(s.age, () => true);

		required(s.guardianName, {
			message: 'Guardian name is required for users under 18',
			when: ({ valueOf }) => Number(valueOf(s.age)) < 18,
		});

		debounce(s.username, 300);

		// validate(s.email, ({ value, valueOf }) => {
		// 	const confirm = value();
    //   const password = valueOf(s.username);
	
    //   if (!password || !confirm) {
    //     return null; // let required handle "empty" cases
    //   }

		// 	if (confirm !== password) {
    //     return {
    //       kind: 'passwordMismatch',
    //       message: 'Passwords do not match',
    //     };
    //   }

		// 	return null;
		// });

		validateAsync(s.username, {
			params: ({ value }) => {
					const val = value();
					// Don't check empty or invalid (minLength, required) cases
					if (!val || val.length < 3) return undefined;
					return val;
			},
			factory: params =>
					resource({
							params,
							loader: async ({ params }) => {
									const username = params;
									const available = await this.checkUsernameAvailability(username);
									return available;
							}
					}),
			onSuccess: (result: boolean) => {
				// result is the return value from the loader (the boolean)
				if (result === false) {
						return {
							kind: 'username_taken',
							message: 'This username is already taken',
						};
				}
				return null;
			},
			onError: (error: unknown) => {
					// Handle any errors that occur during validation
					// Return null to ignore the error, or return a customError if you want to show it
					console.error('Validation error:', error);
					return null;
			}
	});

	applyEach(s.alternateEmails, emailPath => {
		required(emailPath, {
			message: 'Alternate email is required',
		});
	
		email(emailPath, {
			message: 'Enter a valid alternate email address',
		});
	});
});

	// protected getUsernameError(): string {
	// 	const control = this.form.get('username');
	// 	if (control?.hasError('required')) {
	// 		return 'Username is required';
	// 	}
	// 	if (control?.hasError('usernameInvalid')) {
	// 		return control.getError('usernameInvalid').message;
	// 	}
	// 	return '';
	// }

	protected getUsernameError = computed(() => {
		const errors = this.form.username().errors();

		const required = errors.find(e => e.kind === 'required');
		if (required) {
			return 'Username is required';
		}

		const invalid = errors.find(e => e.kind === 'usernameInvalid');
		if (invalid) {
			return invalid?.message;
		}

		return '';
	});

	protected getEmailError = computed(() => {
		const errors = this.form.email().errors();

		const required = errors.find(e => e.kind === 'required');
		if (required) {
			return 'Email is required';
		}

		const email = errors.find(e => e.kind === 'email');
		if (email) {
			return 'Please enter a valid email address';
		}

		return '';
	});

	protected addAlternateEmail() {
		this.model.update(current => ({
			...current,
			alternateEmails: [...current.alternateEmails, ''],
		}));
	}
	
	protected removeAlternateEmail(index: number) {
		this.model.update(current => ({
			...current,
			alternateEmails: current.alternateEmails.filter((_, i) => i !== index),
		}));
	}

	protected onSubmit(event: SubmitEvent) {
		// Stop the browser from doing a full page reload
		event.preventDefault();
	
		// If the form is invalid, don't bother submitting
		if (!this.form().valid()) {
			return;
		}
	
		// Use the submit() helper to run our submit logic
		submit(this.form, async form => {
				// For now, just log it — this is where your API call would go
				// console.log('Submitted value:', form().value());

				// await new Promise(resolve => setTimeout(resolve, 1500));

				const value = form().value();
				const result = await this.api.register(value);

				if (result.ok) {
					console.log('Submitted value:', form().value());
					return undefined;
				}

				return [{
					kind: 'server.unavailable',
					message: 'Signup service is temporarily unavailable. Please try again.',
				}];
		});
	}

	private checkUsernameAvailability(username: string): Promise<boolean> {
    return new Promise(resolve => {
        setTimeout(() => {
            const taken = ['admin', 'test', 'brian'];
            resolve(!taken.includes(username.toLowerCase()));
        }, 1000);
    });
	}
}
