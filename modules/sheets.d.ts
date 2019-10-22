declare module "spreadsheet-to-json" {
	interface ExtractOptions {
		spreadsheetKey: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		credentials?: any;
		sheetsToExtract?: string[];
		formatCell?: (sheetTitle: string, columnTitle: string, value: string) => string;
	}
	interface SheetRow {
		[column: string]: string;
	}
	interface SheetResults {
		[sheet: string]: SheetRow[];
	}
	function extractSheets(
		options: ExtractOptions,
		cb: (err: Error | undefined, data: SheetResults | undefined) => void
	): void;
}
