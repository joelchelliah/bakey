import { IconButton, TextButton } from "../../components/Button";
import { Card } from "../../components/Card";
import { Icon } from "../../components/Icon";
import { Input } from "../../components/Input";
import { NumField } from "../../components/NumField";
import { Row } from "../../components/Row";
import type { Variant } from "../../types";
import { cx } from "../../util";
import s from "./VariantPicker.module.css";

interface VariantPickerProps {
  variants: Variant[];
  variant: Variant;
  usesLiquidRemainder: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: () => void;
  onChange: (fn: (v: Variant) => Variant) => void;
}

/** Variant tabs, and the name and hydration of the selected variant. */
export function VariantPicker({
  variants,
  variant,
  usesLiquidRemainder,
  onSelect,
  onAdd,
  onDelete,
  onChange,
}: VariantPickerProps) {
  return (
    <>
      <div className={s.tabs}>
        {variants.map((v) => (
          <button
            key={v.id}
            className={cx(v.id === variant.id && s.active)}
            onClick={() => onSelect(v.id)}
          >
            {v.name || "Untitled"}
          </button>
        ))}
        <button aria-label="Add variant" onClick={onAdd}>
          <Icon name="plus" size={16} />
        </button>
      </div>

      <Card>
        <Row>
          <Input
            placeholder="Variant name"
            value={variant.name}
            onChange={(e) => onChange((v) => ({ ...v, name: e.target.value }))}
          />
          {variants.length > 1 && (
            <IconButton
              icon="trash"
              size={18}
              danger
              label="Delete variant"
              onClick={onDelete}
            />
          )}
        </Row>
        <Row
          as="label"
          label="Hydration"
          sub={
            usesLiquidRemainder ? "target for the liquid remainder" : "optional"
          }
        >
          {variant.hydration !== undefined ? (
            <span className={s.inline}>
              <NumField
                value={variant.hydration}
                suffix="%"
                onChange={(n) => onChange((v) => ({ ...v, hydration: n }))}
              />
              <IconButton
                icon="x"
                size={18}
                label="Remove hydration"
                onClick={() =>
                  onChange((v) => ({ ...v, hydration: undefined }))
                }
              />
            </span>
          ) : (
            <TextButton
              onClick={() => onChange((v) => ({ ...v, hydration: 70 }))}
            >
              Add
            </TextButton>
          )}
        </Row>
      </Card>
    </>
  );
}
