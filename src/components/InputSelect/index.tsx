import Downshift from "downshift";
import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { DropdownPosition, GetDropdownPositionFn, InputSelectOnChange, InputSelectProps, Employee } from "./types"; // Assuming Employee is a type

const EMPTY_EMPLOYEE: Employee = { id: "ALL", firstName: "All", lastName: "Employees" }; // Define your 'All Employees' option

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    left: 0,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (!selectedItem || (selectedItem as any).id === EMPTY_EMPLOYEE.id) {
        // If 'All Employees' is selected, pass null or another special value
        consumerOnChange(null); // Ensure that `null` is passed when selecting "All Employees"
      } else {
        // Otherwise, proceed as normal
        consumerOnChange(selectedItem);
      }
      setSelectedValue(selectedItem);
    },
    [consumerOnChange]
  );

  const updateDropdownPosition = useCallback((target: HTMLElement) => {
    const { top, left } = target.getBoundingClientRect();
    const { scrollY } = window;
    setDropdownPosition({
      top: scrollY + top + 63, // Adjust 63 based on your dropdown's height or offset
      left,
    });
  }, []);

  const handleScroll = useCallback(() => {
    const selectedElement = document.getElementById("RampSelectButton");
    if (selectedElement) {
      updateDropdownPosition(selectedElement);
    }
  }, [updateDropdownPosition]);

  useEffect(() => {
    if (isDropdownOpen) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      window.removeEventListener("scroll", handleScroll);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isDropdownOpen, handleScroll]);

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
      onStateChange={({ isOpen }) => setIsDropdownOpen(isOpen || false)}
    >
      {({
        getItemProps,
        getLabelProps,
        getMenuProps,
        isOpen,
        highlightedIndex,
        selectedItem,
        getToggleButtonProps,
        inputValue,
      }) => {
        const toggleProps = getToggleButtonProps();
        const parsedSelectedItem = selectedItem === null ? null : parseItem(selectedItem);

        return (
          <div className="RampInputSelect--root">
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              id="RampSelectButton"
              className="RampInputSelect--input"
              onClick={(event) => {
                updateDropdownPosition(event.target as HTMLElement);
                toggleProps.onClick(event);
              }}
            >
              {inputValue}
            </div>

            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": isOpen,
              })}
              {...getMenuProps()}
              style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
            >
              {renderItems()}
            </div>
          </div>
        );

        function renderItems() {
          if (!isOpen) {
            return null;
          }

          if (isLoading) {
            return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>;
          }

          if (items.length === 0) {
            return <div className="RampInputSelect--dropdown-item">No items</div>;
          }

          return items.map((item, index) => {
            const parsedItem = parseItem(item);
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected":
                      parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            );
          });
        }
      }}
    </Downshift>
  );
}

const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left } = target.getBoundingClientRect();
    const { scrollY } = window;
    return {
      top: scrollY + top + 63, // Adjust this value based on your dropdown's layout
      left,
    };
  }

  return { top: 0, left: 0 };
};
