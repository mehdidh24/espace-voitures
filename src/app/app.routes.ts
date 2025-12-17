import { Routes } from '@angular/router';
import { GestionProduitsComponent } from './gestion-produits/gestion-produits.component';
import { AjoutProduitComponent } from './ajout-produit/ajout-produit.component';

export const routes: Routes = [
    
    {path:'gestion-produits',component:GestionProduitsComponent},
    { path: 'ajout-produit', component: AjoutProduitComponent },
    { path: '**', redirectTo: '' }
];