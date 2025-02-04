import { TestBed } from '@angular/core/testing';

import { DataTextService } from './data-text.service';

describe('DataTextService', () => {
  let service: DataTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataTextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
