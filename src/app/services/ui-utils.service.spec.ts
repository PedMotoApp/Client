import { TestBed } from '@angular/core/testing';

import { UiUtilsService } from './ui-utils.service';

describe('UiUtilsService', () => {
  let service: UiUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UiUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
