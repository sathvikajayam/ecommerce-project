import { BrowserRouter as Route } from "react-router-dom";

import "font-awesome/css/font-awesome.min.css";
import SearchScreen from "../pages/SearchScreen";

<Route path="/search/:keyword" element={<SearchScreen />} />


export { default as Navbar } from './Navbar';
export { default as Main } from './main';
export { default as Product } from './Products';
export { default as BrandLogoSection } from './BrandLogoSection';
export { default as BrandShowcase } from './BrandShowcase';
export { default as CategoryShowcase } from './CategoryShowcase';
export { default as HeroGrid } from './HeroGrid';
export { default as TopPicks } from './TopPicks';
export { default as HomepageSections } from './HomepageSections';
export { default as HomepageProductFeed } from './HomepageProductFeed';
