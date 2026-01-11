import { Injectable } from '@angular/core';

export interface SignUpForm {
  username: string;
  email: string;
	// age: string;
	age: number;
	guardianName: string;
	// address: Address;
	alternateEmails: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthApiMockService {
  async register(value: SignUpForm): Promise<
    | { ok: true }
    | { ok: false; code: 'SERVER_DOWN' }
  > {
    await new Promise(resolve => setTimeout(resolve, 800));

    return { ok: false, code: 'SERVER_DOWN' };

    // return { ok: true };
  }
}
