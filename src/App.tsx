import { useState } from 'react'
import './App.css'
import { Link, Outlet } from 'react-router-dom'
import { RouteObject } from 'react-router-dom'

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <Layout />,
    children: [
      { 
        index: true, 
        lazy: () => import('./pages/HomePage'),
      },
      {
        path: "/about",
        lazy: () => import('./pages/AboutPage'),
      },
      {
        path: "/contact",
        lazy: () => import('./pages/ContactPage'),
      },
      {
        path: "/admin",
        lazy: () => import('./components/admin/AdminDashboard'),
      }
    ]
  }
];

function Layout() {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact</Link>
          </li>
          <li>
            <Link to="/admin">Admin</Link>
          </li>
        </ul>
      </nav>
      <hr />
      <Outlet />
    </div>
  );
}
