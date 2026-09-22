import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Delete, RotateCcw } from "lucide-react";

interface PosCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PosCalculatorModal({
  isOpen,
  onClose,
}: PosCalculatorModalProps) {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const clearAll = () => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (waitingForOperand) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      let result = currentValue;

      switch (operator) {
        case "+":
          result = currentValue + inputValue;
          break;
        case "-":
          result = currentValue - inputValue;
          break;
        case "×":
          result = currentValue * inputValue;
          break;
        case "÷":
          result = inputValue === 0 ? 0 : currentValue / inputValue;
          break;
      }

      // Round to 4 decimal places to prevent float precision issues
      result = Math.round(result * 10000) / 10000;
      setDisplay(String(result));
      setPrevValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const handleEqual = () => {
    if (!operator || prevValue === null) return;
    const inputValue = parseFloat(display);
    let result = prevValue;

    switch (operator) {
      case "+":
        result = prevValue + inputValue;
        break;
      case "-":
        result = prevValue - inputValue;
        break;
      case "×":
        result = prevValue * inputValue;
        break;
      case "÷":
        result = inputValue === 0 ? 0 : prevValue / inputValue;
        break;
    }

    result = Math.round(result * 10000) / 10000;
    setDisplay(String(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[340px] p-4 gap-3 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl">
        <DialogHeader className="p-0 pb-1">
          <DialogTitle className="text-base font-semibold flex items-center justify-between text-slate-800 dark:text-slate-100">
            <span>POS Calculator</span>
            <span className="text-xs font-normal text-muted-foreground">
              {operator && prevValue !== null ? `${prevValue} ${operator}` : ""}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Display */}
        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-right">
          <div className="text-3xl font-mono font-bold tracking-tight text-slate-900 dark:text-white truncate">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
            onClick={clearAll}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-sm font-semibold"
            onClick={backspace}
          >
            <Delete className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-semibold"
            onClick={() => {
              const val = parseFloat(display);
              setDisplay(String(val / 100));
            }}
          >
            %
          </Button>
          <Button
            type="button"
            className="h-12 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => performOperation("÷")}
          >
            ÷
          </Button>

          {/* Row 2 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("7")}
          >
            7
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("8")}
          >
            8
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("9")}
          >
            9
          </Button>
          <Button
            type="button"
            className="h-12 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => performOperation("×")}
          >
            ×
          </Button>

          {/* Row 3 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("4")}
          >
            4
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("5")}
          >
            5
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("6")}
          >
            6
          </Button>
          <Button
            type="button"
            className="h-12 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => performOperation("-")}
          >
            −
          </Button>

          {/* Row 4 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("1")}
          >
            1
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("2")}
          >
            2
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-medium"
            onClick={() => inputDigit("3")}
          >
            3
          </Button>
          <Button
            type="button"
            className="h-12 text-lg font-bold bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => performOperation("+")}
          >
            +
          </Button>

          {/* Row 5 */}
          <Button
            type="button"
            variant="outline"
            className="h-12 col-span-2 text-base font-medium"
            onClick={() => inputDigit("0")}
          >
            0
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-12 text-base font-bold"
            onClick={inputDecimal}
          >
            .
          </Button>
          <Button
            type="button"
            className="h-12 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
            onClick={handleEqual}
          >
            =
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
