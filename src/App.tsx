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
        path: "/about-our-mission",
        lazy: () => import('./pages/AboutPage'),
      },
      {
        path: "/contact-us",
        lazy: () => import('./pages/ContactPage'),
      },
      {
        path: "/admin",
        lazy: () => import('./components/admin/AdminDashboard'),
      },
      {
        path: "/:categoryName/:testName",
        lazy: () => import('./components/pages/TestView'),
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
            <Link to="/about-our-mission">About</Link>
          </li>
          <li>
            <Link to="/contact-us">Contact</Link>
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
