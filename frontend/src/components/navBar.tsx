import { BiBarcodeReader, BiHomeAlt, BiFridge, BiBasket, BiBookOpen } from "react-icons/bi";

const NavBar = () => {
  return (
    <nav className="p-4">
      <div className="flex justify-around text-2xl">
        <NavItem icon={<BiHomeAlt />} />
        <NavItem icon={<BiFridge />} />
        <NavItem icon={<BiBarcodeReader />} />
        <NavItem icon={<BiBookOpen />} />
        <NavItem icon={<BiBasket />} />
      </div>
    </nav>
  );
};

const NavItem = ({ icon, label }: { icon: React.ReactNode; label?: string }) => {
  return (
    <button className="cursor-pointer">
      {icon}
      <span>{label}</span>
    </button>
  );
};

export { NavBar };
