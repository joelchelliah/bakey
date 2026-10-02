import { IconButton } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { Row } from "../../components/Row";
import type { Ingredient, Section } from "../../types";
import { uid } from "../../util";
import { AddButton } from "./AddButton";
import { IngredientEditor } from "./IngredientEditor";
import s from "./SectionCard.module.css";

interface SectionCardProps {
  section: Section;
  /** Show the name row (always when there are several sections). */
  showName: boolean;
  namePlaceholder: string;
  pctById: Map<string, number | null>;
  allIngredients: Ingredient[];
  modifierEnabled: boolean;
  onChange: (fn: (s: Section) => Section) => void;
  onMove: (ingredientId: string, dir: -1 | 1) => void;
  onDelete: () => void;
}

export function SectionCard({
  section,
  showName,
  namePlaceholder,
  pctById,
  allIngredients,
  modifierEnabled,
  onChange,
  onMove,
  onDelete,
}: SectionCardProps) {
  const setIng = (iid: string, patch: Partial<Ingredient>) =>
    onChange((x) => ({
      ...x,
      ingredients: x.ingredients.map((i) =>
        i.id === iid ? { ...i, ...patch } : i,
      ),
    }));

  return (
    <Card>
      {showName && (
        <Row className={s.name}>
          <Input
            placeholder={namePlaceholder}
            value={section.name}
            onChange={(e) => onChange((x) => ({ ...x, name: e.target.value }))}
          />
          <IconButton
            icon="trash"
            size={18}
            danger
            label="Delete section"
            onClick={() =>
              (!section.ingredients.length ||
                confirm("Delete this section and its ingredients?")) &&
              onDelete()
            }
          />
        </Row>
      )}
      {section.ingredients.map((ing) => (
        <IngredientEditor
          key={ing.id}
          ing={ing}
          computedPct={pctById.get(ing.id) ?? null}
          others={allIngredients.filter((x) => x.id !== ing.id)}
          modifierEnabled={modifierEnabled}
          onChange={(patch) => setIng(ing.id, patch)}
          onMove={(d) => onMove(ing.id, d)}
          onDelete={() =>
            onChange((x) => ({
              ...x,
              ingredients: x.ingredients.filter((i) => i.id !== ing.id),
            }))
          }
        />
      ))}
      <AddButton
        onClick={() =>
          onChange((x) => ({
            ...x,
            ingredients: [
              ...x.ingredients,
              {
                id: uid(),
                name: "",
                group: "other",
                amount: { kind: "percent", value: 0 },
              },
            ],
          }))
        }
      >
        Ingredient
      </AddButton>
    </Card>
  );
}
