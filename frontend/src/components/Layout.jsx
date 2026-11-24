import React from 'react';

export default function Layout({ children, title = "USN", rightContent }) {
  return (
    <div>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" />
          <span>{title}</span>
        </div>
        <div className="header-right">
          {rightContent || "кликабельный прототип"}
        </div>
      </header>
      <main className="page-shell">{children}</main>
    </div>
  );
}