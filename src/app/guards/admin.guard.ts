// import { Injectable } from '@angular/core';
// import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
// import { Observable, map } from 'rxjs';
// import { AuthService } from '../services/auth.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class AdminGuard implements CanActivate {

//   constructor(private authService: AuthService, private router: Router) { }

//   canActivate(
//     next: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

//     return this.authService.isAdmin().pipe(
//       map(isAdmin => {
//         if (isAdmin) {
//           return true;
//         } else {
//           this.router.navigate(['/login']); // Redirect to the login page if the user is not an admin
//           return false;
//         }
//       })
//     );
//   }
// }
