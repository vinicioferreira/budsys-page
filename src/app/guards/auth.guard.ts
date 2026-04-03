import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean | UrlTree> {
    const user = await this.afAuth.currentUser;

    if (user) {
      return true;
    }

    return this.router.createUrlTree(['/login']);
  }
}