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
          { icon: <BiFridge />, label: "Fridge" },
          { icon: <BiBarcodeReader />, label: "Scan" },
          { icon: <BiBookOpen />, label: "Recipes" },
          { icon: <BiBasket />, label: "Shopping" },
        ].map((item, index) => (
          <div
            key={index}
            className={`
              ${
                selectedPage === item.label
                  ? "border-purple-500 border-b-4 flex items-center justify-center"
                  : ""
              } `}
          >
            <NavItem
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
  onClick,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick: () => void;
}) => {
  return (
    <button className="cursor-pointer" onClick={onClick}>
      {icon}
      {/* <span>{label}</span> */}
    </button>
  );
};

export { NavBar };
