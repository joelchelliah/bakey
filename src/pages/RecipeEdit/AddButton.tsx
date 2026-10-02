import { Icon } from "../../components/Icon";
import { cx } from "../../util";
import s from "./AddButton.module.css";

interface AddButtonProps {
  standalone?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function AddButton({ standalone, onClick, children }: AddButtonProps) {
  return (
    <button className={cx(s.add, standalone && s.standalone)} onClick={onClick}>
      <Icon name="plus" size={16} /> {children}
    </button>
  );
}
