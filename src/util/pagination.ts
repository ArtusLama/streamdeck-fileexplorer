import { EventEmitter } from "@elgato/streamdeck";

export type PaginationEvents = {
	update: [];
};

export class Pagination<T> extends EventEmitter<PaginationEvents> {
	private items: T[] = [];
	private itemsPerPage: number = 0;
	private currentPage = 0;

	public setItems(items: T[]): void {
		this.items = items;
		this.refresh();
	}

	public getItems(): T[] {
		return this.items;
	}

	public getItem(index: number): T | undefined {
		return this.items[index];
	}

	public getItemOnCurrentPage(index: number): T | undefined {
		return this.items[this.currentPage * this.itemsPerPage + index];
	}

	public setItemsPerPage(itemsPerPage: number): void {
		this.itemsPerPage = itemsPerPage;
		this.refresh();
	}

	public getItemsPerPage(): number {
		return this.itemsPerPage;
	}

	public getTotalPages(): number {
		if (this.itemsPerPage === 0) return 0;
		return Math.ceil(this.items.length / this.itemsPerPage);
	}

	public setCurrentPage(page: number): void {
		page = Math.max(0, Math.min(this.getTotalPages() - 1, page));
		this.currentPage = page;
		this.emit("update");
	}

	public getCurrentPage(): number {
		return this.currentPage;
	}

	public isFirstPage(): boolean {
		return this.currentPage === 0;
	}

	public isLastPage(): boolean {
		return this.currentPage >= this.getTotalPages() - 1;
	}

	public goToNextPage(): void {
		if (this.isLastPage()) return;
		this.setCurrentPage(this.currentPage + 1);
	}

	public goToPreviousPage(): void {
		if (this.isFirstPage()) return;
		this.setCurrentPage(this.currentPage - 1);
	}

	public refresh(): void {
		this.setCurrentPage(this.currentPage);
	}
}
