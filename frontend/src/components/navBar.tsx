import type { Dispatch, SetStateAction } from "react";
import { BiBarcodeReader, BiHomeAlt, BiFridge, BiBasket, BiBookOpen } from "react-icons/bi";

const NavBar = ({
  selectedPage,
  setSelectPage,
}: {
  selectedPage: string;
  setSelectPage: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <nav className="p-4">
      <div className="flex justify-around text-2xl">
        {[
          { icon: <BiHomeAlt />, label: "Home" },
          { icon: <BiFridge />, label: "Pantree" },
          { icon: <BiBarcodeReader />, label: "Scan" },
          { icon: <BiBookOpen />, label: "Recipes" },
          { icon: <BiBasket />, label: "Shopping" },
        ].map((item, index) => (
          <div
            key={index}
            className={`
             w-full`}
          >
            <NavItem
              isSelected={selectedPage === item.label}
              icon={item.icon}
              label={item.label}
              onClick={() => setSelectPage(item.label)}
            />
          </div>
        ))}
      </div>
    </nav>
  );
};

const NavItem = ({
  icon,
  isSelected,
  // label,
  onClick,
}: {
  isSelected: boolean;
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
}) => {
  return (
    <button className="cursor-pointer w-full flex items-center justify-center" onClick={onClick}>
      <div
        className={`${
          isSelected ? "border-purple-500 border-b-4 flex items-center justify-center" : ""
        }`}
      >
        {icon}
        {/* <span>{label}</span> */}
      </div>
    </button>
  );
};

export { NavBar };
