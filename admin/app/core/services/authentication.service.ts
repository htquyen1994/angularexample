import { Injectable } from '@angular/core';

@Injectable()
export class AuthenticationService {
    constructor() {
    }

    redirectToLoginPage() {
        window.location.href = `${window.location.href}?${Math.random()}`;
    }
}
