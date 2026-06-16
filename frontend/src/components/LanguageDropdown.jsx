import React from "react";
import { languages } from "../constants.js";

const LanguageDropdown = ({
  onLanguageChange,
  lang,
  ver,
}) => {
  const handleChange = (event) => {
    const selectedLanguage = event.target.value;
    const selectedVersion = languages.find(
      (l) => l.name === selectedLanguage
    ).version;
    onLanguageChange(selectedLanguage, selectedVersion);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        className="appearance-none bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl px-4 py-2 pr-10 shadow-lg text-sm cursor-pointer outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-semibold tracking-wide uppercase"
        value={lang}
        onChange={handleChange}
      >
        {languages.map((lang) => (
          <option key={lang.name} value={lang.name} className="bg-slate-900 text-slate-200 font-sans normal-case py-2">
            {lang.name.toUpperCase()} (v{lang.version})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  );
};

export default LanguageDropdown;
