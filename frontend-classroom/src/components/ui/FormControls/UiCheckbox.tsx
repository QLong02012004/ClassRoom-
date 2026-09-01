import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

export const UiCheckbox: React.FC<React.ComponentProps<typeof Checkbox>> = (props) => {
  return <Checkbox {...props} />;
};

export default UiCheckbox;
