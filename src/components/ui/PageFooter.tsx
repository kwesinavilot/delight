import React from 'react';

const PageFooter: React.FC = () => {
  return (
    <div className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
      <p>Need help? Check out our documentation or contact support.</p>
      <div className="flex justify-center space-x-4 mt-2">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({
              url: chrome.runtime.getURL('src/pages/welcome/index.html'),
              active: true
            });
          }}
          className="hover:text-blue-500"
        >
          About
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({
              url: chrome.runtime.getURL('src/pages/updates/index.html'),
              active: true
            });
          }}
          className="hover:text-blue-500"
        >
          What's New?
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({
              url: chrome.runtime.getURL('src/pages/userguide/index.html'),
              active: true
            });
          }}
          className="hover:text-blue-500"
        >
          User Guide
        </a>
        <a href="mailto:andrewsankomahene@gmail.com" className="hover:text-blue-500">Support</a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({
              url: chrome.runtime.getURL('src/pages/privacy/index.html'),
              active: true
            });
          }}
          className="hover:text-blue-500"
        >
          Privacy Policy
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            chrome.tabs.create({
              url: chrome.runtime.getURL('src/pages/accuracy/index.html'),
              active: true
            });
          }}
          className="hover:text-blue-500"
        >
          Disclaimer
        </a>
      </div>
    </div>
  );
};

export default PageFooter;